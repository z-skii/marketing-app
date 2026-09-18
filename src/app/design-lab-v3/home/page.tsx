import { UserShell } from "../x/Nav";
import { Feed } from "../x/home/Feed";

/** V3 User Home at /design-lab-v3/home: WHAT CAN I EARN FROM RIGHT NOW. Fixture data only. ?open=<opportunity id> enters an opportunity directly. */
export default function V3UserHome() {
  return <UserShell title="Home" active="Home"><Feed /></UserShell>;
}
