/**
 * The product icon set: Phosphor, one family, one weight, one size scale.
 * Server-renderable (the ssr entry has no context), usable from client
 * components too. Names follow what the interface means, not the glyph.
 */
export {
  House as HomeIcon, Compass as CompassIcon, Megaphone as MegaphoneIcon, Plus as PlusIcon, Camera as CameraIcon,
  CalendarDots as CalendarIcon, CalendarBlank as CalendarBlankIcon, CalendarCheck as CalendarCheckIcon, Cards as WalletCardsIcon, Wallet as WalletIcon,
  ChartLineUp as ChartIcon, TrendUp as TrendIcon, Car as CarIcon, CurrencyDollar as DollarIcon, Coins as CoinsIcon, Bank as BankIcon,
  Pulse as ActivityIcon, User as UserIcon, Users as UsersIcon, Heart as HeartIcon, QrCode as QrIcon, Play as PlayIcon, Pause as PauseIcon,
  InstagramLogo as InstagramIcon, Check as CheckIcon, CheckCircle as CheckCircleIcon, SealCheck as VerifiedIcon, Clock as ClockIcon, Timer as TimerIcon, Hourglass as HourglassIcon,
  ArrowRight as ArrowRightIcon, ArrowLeft as ArrowLeftIcon, ArrowUpRight as ArrowUpRightIcon, ArrowsClockwise as RefreshIcon,
  Bell as BellIcon, ChatCircle as MessagesIcon, MagnifyingGlass as SearchIcon, Gear as SettingsIcon, Storefront as StorefrontIcon, Buildings as BuildingsIcon,
  X as CloseIcon, CaretRight as ChevronRightIcon, CaretLeft as ChevronLeftIcon, CaretDown as ChevronDownIcon, CaretUp as ChevronUpIcon, DotsThree as MoreIcon,
  MapPin as PinIcon, Star as StarIcon, Sparkle as SparkleIcon, Gift as GiftIcon, Trophy as TrophyIcon, Ticket as TicketIcon, Stamp as StampIcon,
  VideoCamera as VideoIcon, Image as ImageIcon, UploadSimple as UploadIcon, DownloadSimple as DownloadIcon, Eye as EyeIcon, Copy as CopyIcon, Link as LinkIcon,
  LockSimple as LockIcon, ShieldCheck as ShieldIcon, Lightning as LightningIcon, Receipt as ReceiptIcon, CreditCard as CardIcon, Palette as PaletteIcon,
  WarningCircle as WarningIcon, Info as InfoIcon, Question as HelpIcon, PaperPlaneTilt as SendIcon, Scan as ScanIcon, SteeringWheel as SteeringIcon, Handshake as HandshakeIcon,
  Devices as DevicesIcon, DeviceMobile as PhoneIcon, SlidersHorizontal as FiltersIcon, Funnel as FunnelIcon, SignOut as SignOutIcon, Percent as PercentIcon, Globe as GlobeIcon,
  FacebookLogo as FacebookIcon, TiktokLogo as TiktokIcon, GoogleLogo as GoogleIcon, Robot as RobotIcon,
  Envelope as MailIcon, Phone as CallIcon, Pencil as EditIcon, Trash as TrashIcon, SquaresFour as GridIcon, ListBullets as ListIcon, Rows as RowsIcon, Fire as FireIcon, Sun as SunIcon,
} from "@phosphor-icons/react/dist/ssr";

/** The size scale: 16 inline, 20 in controls and rows, 24 in navigation and headers, 28 hero. */
export const ICON = { xs: 14, sm: 16, md: 20, lg: 24, xl: 28 } as const;
/** One stroke: Phosphor "regular"; "bold" only for the filled Create control; "fill" for selected states. */
export const ICON_WEIGHT = "regular" as const;
