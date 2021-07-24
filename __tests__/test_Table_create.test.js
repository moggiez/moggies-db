const { Table } = require("../db");
const { mockAWSLib, tableConfigs } = require("./helpers");
const uuid = require("uuid");

describe("Table.create", () => {
  it("builds correct params when not versionned", () => {
    const config = tableConfigs.loadtests;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const record = {
      test1: "abc",
      test2: 1,
    };

    table.create({ hashKey: "hashKeyValue", sortKey: "sortKeyValue", record });

    const expectedResult = {
      TableName: "loadtests",
      ReturnValues: "ALL_OLD",
    };
    expectedResult.Item = record;
    expectedResult.Item[config.hashKey] = "hashKeyValue";
    expectedResult.Item[config.sortKey] = "sortKeyValue";
    const expectedUpdatedAt = new Date().toISOString();

    expect(mockedFunctions.put).toHaveBeenCalledWith(
      expect.objectContaining({
        TableName: expectedResult.TableName,
        Item: expect.objectContaining(expectedResult.Item),
      }),
      expect.any(Function)
    );
    expect(mockedFunctions.put.mock.calls[0][0].Item.CreatedAt).toContain(
      expectedUpdatedAt.substr(0, 20)
    );
    expect(mockedFunctions.put.mock.calls[0][0].Item.UpdatedAt).toContain(
      expectedUpdatedAt.substr(0, 20)
    );
    expect(mockedFunctions.put.mock.calls[0][0].Item).not.toHaveProperty(
      "Latest"
    );
  });

  it("builds correct params when versionned", () => {
    const config = tableConfigs.playbook_versions;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const record = {
      test1: "abc",
      test2: 1,
    };
    const sortKey = "v1";

    table.create({ hashKey: "hashKeyValue", sortKey, record });

    const expectedResult = {
      TableName: "playbook_versions",
      ReturnValues: "ALL_OLD",
    };
    expectedResult.Item = record;
    expectedResult.Item[config.hashKey] = "hashKeyValue";
    expectedResult.Item[config.sortKey] = sortKey;
    expectedResult.Item.Latest = 0;
    const expectedUpdatedAt = new Date().toISOString();

    expect(mockedFunctions.put).toHaveBeenCalledWith(
      expect.objectContaining({
        TableName: expectedResult.TableName,
        Item: expect.objectContaining(expectedResult.Item),
      }),
      expect.any(Function)
    );
    expect(mockedFunctions.put.mock.calls[0][0].Item).not.toHaveProperty(
      "CreatedAt"
    );
    expect(mockedFunctions.put.mock.calls[0][0].Item.UpdatedAt).toContain(
      expectedUpdatedAt.substr(0, 20)
    );
  });

  it("throws error when versionned and sort key doesn't match version pattern", () => {
    const config = tableConfigs.playbook_versions;
    const { mockAWS, _ } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const record = {
      test1: "abc",
      test2: 1,
    };
    const sortKey = "vA";

    expect(() =>
      table.create({ hashKey: "hashKeyValue", sortKey, record })
    ).toThrow(
      `Sort key '${sortKey}' doesn't match expected pattern /v[0-9]+/g`
    );
  });

  it("doesn't throw error when versionned and sort key matches version pattern", () => {
    const config = tableConfigs.playbook_versions;
    const { mockAWS, _ } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const record = {
      test1: "abc",
      test2: 1,
    };
    const sortKey = "v999";

    expect(() =>
      table.create({ hashKey: "hashKeyValue", sortKey, record })
    ).not.toThrow();
  });

  it("calls resolve when docClient.put is successful", async () => {
    const config = tableConfigs.playbook_versions;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const responseData = { what: "Successful data" };
    mockedFunctions.put.mockImplementation((params, callback) =>
      callback(null, responseData)
    );

    const data = await table.create({
      hashKey: uuid.v4(),
      sortKey: "v1",
      record: {},
    });
    expect(data).toEqual(responseData);
  });

  it("calls reject when docClient.put fails", async () => {
    const config = tableConfigs.playbook_versions;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const expectedError = "This is my error";
    mockedFunctions.put.mockImplementation((params, callback) =>
      callback(expectedError, null)
    );

    try {
      await table.create({
        hashKey: uuid.v4(),
        sortKey: "v1",
        record: {},
      });
      fail("Promise.reject wasn't called");
    } catch (err) {
      expect(err).toEqual(expectedError);
    }
  });

  it("calls reject when exception thrown", async () => {
    const config = tableConfigs.playbook_versions;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const expectedError = new Error("This is my error");
    mockedFunctions.put.mockImplementation((params, callback) => {
      throw expectedError;
    });

    try {
      await table.create({
        hashKey: uuid.v4(),
        sortKey: "v1",
        record: {},
      });
      fail("Promise.reject wasn't called");
    } catch (err) {
      expect(err).toEqual(expectedError);
    }
  });
});
