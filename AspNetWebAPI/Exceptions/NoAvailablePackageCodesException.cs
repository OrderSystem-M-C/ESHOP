namespace AspNetCoreAPI.Exceptions
{
    public class NoAvailablePackageCodesException : Exception
    {
        public NoAvailablePackageCodesException(string message): base(message) { }
    }
}
