namespace Class4910Tests.Integration;


public class ApplicationControllerTests : IClassFixture<Class4910ApiFactory>
{
    private readonly Class4910ApiFactory _apiFactory;
    private readonly CancellationToken _cancelToken;

    public ApplicationControllerTests(Class4910ApiFactory apiFactory)
    {
        _apiFactory = apiFactory;
        _apiFactory.InitializeAsync().GetAwaiter().GetResult();

        _cancelToken = TestContext.Current.CancellationToken;
    }
}
