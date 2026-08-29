#!/usr/bin/env python3
"""One-shot Gmail OAuth setup for the Tapmart admin agent.

Prereq (5 browser minutes, once):
  1. console.cloud.google.com -> new project (any name).
  2. APIs & Services -> Library -> enable "Gmail API".
  3. APIs & Services -> OAuth consent screen -> External -> fill the three
     required fields -> add your own Gmail address as a Test user.
  4. Credentials -> Create credentials -> OAuth client ID -> type
     "Desktop app" -> copy the Client ID and Client secret.

Then run:  python3 scripts/gmail_oauth_setup.py

The script opens the Google consent page, catches the redirect on
localhost, exchanges the code for a refresh token, and (if the gh CLI is
installed and authenticated) stores GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET,
GMAIL_REFRESH_TOKEN and GMAIL_SENDER as GitHub Actions secrets on
z-skii/marketing-app. Without gh it prints the values to paste manually.
"""

import json
import shutil
import subprocess
import urllib.parse
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

REPO = "z-skii/marketing-app"
PORT = 8765
REDIRECT = f"http://127.0.0.1:{PORT}"
SCOPE = "https://www.googleapis.com/auth/gmail.modify"


def ask(prompt: str) -> str:
    value = input(prompt).strip()
    while not value:
        value = input(prompt).strip()
    return value


def wait_for_code() -> str:
    captured: dict[str, str] = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):  # noqa: N802
            params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            if "code" in params:
                captured["code"] = params["code"][0]
                self.wfile.write(b"<h2>Done - go back to the terminal.</h2>")
            else:
                self.wfile.write(b"<h2>No code in redirect; try again.</h2>")

        def log_message(self, *args):
            pass

    server = HTTPServer(("127.0.0.1", PORT), Handler)
    while "code" not in captured:
        server.handle_request()
    server.server_close()
    return captured["code"]


def exchange(client_id: str, client_secret: str, code: str) -> dict:
    body = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT,
    }).encode()
    request = urllib.request.Request(
        "https://oauth2.googleapis.com/token", data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def store_secret(name: str, value: str) -> bool:
    if not shutil.which("gh"):
        return False
    result = subprocess.run(
        ["gh", "secret", "set", name, "--repo", REPO, "--body", value],
        capture_output=True,
    )
    return result.returncode == 0


def main() -> None:
    print(__doc__)
    client_id = ask("Client ID: ")
    client_secret = ask("Client secret: ")
    sender = ask("Support email address (the Gmail account you'll authorize): ")

    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode({
        "client_id": client_id,
        "redirect_uri": REDIRECT,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent",
    })
    print("\nOpening Google consent page (sign in as the support account)...")
    print(f"If nothing opens, visit:\n{auth_url}\n")
    webbrowser.open(auth_url)

    code = wait_for_code()
    tokens = exchange(client_id, client_secret, code)
    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        raise SystemExit(f"No refresh token returned: {tokens}")

    secrets = {
        "GMAIL_CLIENT_ID": client_id,
        "GMAIL_CLIENT_SECRET": client_secret,
        "GMAIL_REFRESH_TOKEN": refresh_token,
        "GMAIL_SENDER": sender,
    }
    stored = all(store_secret(name, value) for name, value in secrets.items())
    if stored:
        print("\nAll four GMAIL_* secrets stored on GitHub. The admin agent is live")
        print("on the next 15-minute cycle.")
    else:
        print("\ngh CLI not available - add these four secrets at")
        print(f"https://github.com/{REPO}/settings/secrets/actions :\n")
        for name, value in secrets.items():
            print(f"  {name} = {value}")


if __name__ == "__main__":
    main()
