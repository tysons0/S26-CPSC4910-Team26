namespace Class4910Api;

public static class Routes
{
    public static class Auth
    {
        public const string Base = "Auth";

        public const string Me = "me";
        public const string MeTokenInfo = "me/token-info";

        public const string Login = "login";
        public const string PasswordChange = "password-change";

        public const string RegisterAdmin = "register/admin";
        public const string RegisterDriver = "register/driver";
        public const string RegisterSponsor = "register/sponsor";

        // Full routes for tests
        public const string MeFull = Base + "/" + Me;
        public const string MeTokenInfoFull = Base + "/" + MeTokenInfo;
        public const string LoginFull = Base + "/" + Login;
        public const string PasswordChangeFull = Base + "/" + PasswordChange;
        public const string RegisterAdminFull = Base + "/" + RegisterAdmin;
        public const string RegisterDriverFull = Base + "/" + RegisterDriver;
        public const string RegisterSponsorFull = Base + "/" + RegisterSponsor;
    }
}