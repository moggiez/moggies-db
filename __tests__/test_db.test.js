const { Table } = require("../db");
const { mockAWSLib } = require("./helpers");

describe("Table", () => {
  it("could be instantiated", () => {
    const mockConfig = {};
    const { mockAWS, _ } = mockAWSLib();
    const table = new Table({ config: mockConfig, AWS: mockAWS });
    expect(table).not.toBeUndefined();
    expect(table).not.toBeNull();
  });

  it("get calls AWS.DynamoDB.DocumentClient().get", () => {
    const mockConfig = {};
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: mockConfig, AWS: mockAWS });
    table.get("hashKey", "sortKey");
    expect(mockedFunctions.get).toHaveBeenCalled();
  });

  it("instantiates DynamoDB.DocumentClient with custom endpoint when process.env.env is local", () => {
    const customEnv = {
      env: "local",
      LOCALSTACK_HOSTNAME: "moggies-custom.io",
    };
    process.env = customEnv;
    const mockConfig = {};
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: mockConfig, AWS: mockAWS });
    expect(mockedFunctions.documentClientConstructor).toHaveBeenCalledWith({
      endpoint: `http://${customEnv.LOCALSTACK_HOSTNAME}:4566`,
    });
  });

  it("instantiates DynamoDB.DocumentClient with empty options process.env.env is undefined", () => {
    const customEnv = {};
    process.env = customEnv;
    const mockConfig = {};
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: mockConfig, AWS: mockAWS });
    expect(mockedFunctions.documentClientConstructor).toHaveBeenCalledWith({});
  });

  it("instantiates DynamoDB.DocumentClient with empty options process.env.env is null", () => {
    const customEnv = {};
    process.env = customEnv;
    const mockConfig = {};
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: mockConfig, AWS: mockAWS });
    expect(mockedFunctions.documentClientConstructor).toHaveBeenCalledWith({});
  });

  it("instantiates DynamoDB.DocumentClient with empty options process.env.env is prod", () => {
    const customEnv = {};
    process.env = customEnv;
    const mockConfig = {};
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: mockConfig, AWS: mockAWS });
    expect(mockedFunctions.documentClientConstructor).toHaveBeenCalledWith({});
  });
});

describe("Table.get_config", () => {
  it("returns config", () => {
    const mockConfig = {};
    const { mockAWS, _ } = mockAWSLib();
    const table = new Table({ config: mockConfig, AWS: mockAWS });
    expect(table.getConfig()).toEqual(mockConfig);
  });
});
