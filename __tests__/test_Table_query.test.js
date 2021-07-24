const { Table } = require("../db");
const { mockAWSLib, tableConfigs } = require("./helpers");
const uuid = require("uuid");

describe("Table.query", () => {
  it("builds params when key condition and indexName", () => {
    const config = tableConfigs.loadtests;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    table.query({
      hashKey: "hashKeyValue",
      sortKey: "sortKeyValue",
      indexName: "PlaybookLoadtestIndex",
      filter: null,
    });

    const expectedResult = {
      TableName: "loadtests",
      IndexName: "PlaybookLoadtestIndex",
      KeyConditionExpression: "#pk = :pkv and #skv = :skv",
      ExpressionAttributeNames: {
        "#pk": config.indexes.PlaybookLoadtestIndex.hashKey,
        "#skv": config.indexes.PlaybookLoadtestIndex.sortKey,
      },
      ExpressionAttributeValues: {
        ":pkv": "hashKeyValue",
        ":skv": "sortKeyValue",
      },
    };

    expect(mockedFunctions.query).toHaveBeenCalledWith(
      expectedResult,
      expect.any(Function)
    );
    expect(mockedFunctions.query.mock.calls[0][0]).not.toHaveProperty(
      "FilterExpression"
    );
  });

  it("builds params when key condition and filter provided", () => {
    const config = tableConfigs.loadtests;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const filter = {
      expression: "Active = :active",
      attributes: {
        active: 1,
      },
    };

    table.query({
      hashKey: "hashKeyValue",
      sortKey: "sortKeyValue",
      indexName: null,
      filter,
    });

    const expectedResult = {
      TableName: "loadtests",
      KeyConditionExpression: "#pk = :pkv and #skv = :skv",
      ExpressionAttributeNames: {
        "#pk": config.hashKey,
        "#skv": config.sortKey,
      },
      ExpressionAttributeValues: {
        ":pkv": "hashKeyValue",
        ":skv": "sortKeyValue",
        ":active": filter.attributes.active,
      },
      FilterExpression: filter.expression,
    };

    expect(mockedFunctions.query).toHaveBeenCalledWith(
      expectedResult,
      expect.any(Function)
    );
    expect(mockedFunctions.query.mock.calls[0][0]).not.toHaveProperty(
      "IndexName"
    );
  });

  //NEW

  it("calls resolve when docClient.update is successful", async () => {
    const config = tableConfigs.playbook_versions;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const responseData = { what: "Successful data" };
    mockedFunctions.query.mockImplementation((params, callback) =>
      callback(null, responseData)
    );

    const data = await table.query({
      hashKey: uuid.v4(),
      sortKey: "v0",
    });
    expect(data).toEqual(responseData);
  });

  it("calls reject when docClient.update fails", async () => {
    const config = tableConfigs.playbook_versions;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const expectedError = "This is my error";
    mockedFunctions.query.mockImplementation((params, callback) =>
      callback(expectedError, null)
    );

    try {
      await table.query({
        hashKey: uuid.v4(),
        sortKey: "v0",
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
    mockedFunctions.query.mockImplementation((params, callback) => {
      throw expectedError;
    });

    try {
      await table.query({
        hashKey: uuid.v4(),
        sortKey: "v0",
      });
      fail("Promise.reject wasn't called");
    } catch (err) {
      expect(err).toEqual(expectedError);
    }
  });
});
