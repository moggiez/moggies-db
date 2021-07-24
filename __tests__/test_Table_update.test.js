const { Table } = require("../index");
const { mockAWSLib, tableConfigs } = require("./helpers");
const uuid = require("uuid");

describe("Table.update", () => {
  it("builds correct params when not versionned", () => {
    const config = tableConfigs.loadtests;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const updatedFields = {
      test1: "abc",
      test2: 1,
    };

    table.update({ hashKey: "hashKeyValue", sortKey: "v0", updatedFields });

    const expectedResult = {
      TableName: "loadtests",
      Key: {},
      ReturnValues: "ALL_NEW",
    };
    expectedResult.Key[config.hashKey] = "hashKeyValue";
    expectedResult.Key[config.sortKey] = "v0";
    expectedResult.UpdateExpression = `SET  UpdatedAt = :sfUpdatedAt, test1 = :f0, test2 = :f1`;
    expectedResult.ExpressionAttributeValues = {
      ":f0": updatedFields.test1,
      ":f1": updatedFields.test2,
    };
    const expectedUpdatedAt = new Date().toISOString();

    expect(mockedFunctions.update).toHaveBeenCalledWith(
      expect.objectContaining({
        TableName: expectedResult.TableName,
        Key: expectedResult.Key,
        ReturnValues: expectedResult.ReturnValues,
        ExpressionAttributeValues: expect.objectContaining(
          expectedResult.ExpressionAttributeValues
        ),
      }),
      expect.any(Function)
    );
    expect(
      mockedFunctions.update.mock.calls[0][0].ExpressionAttributeValues[
        ":sfUpdatedAt"
      ]
    ).toContain(expectedUpdatedAt.substr(0, 20));
  });

  it("builds correct params when versionned", () => {
    const config = tableConfigs.playbook_versions;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const updatedFields = {
      test1: "abc",
      test2: 1,
    };

    table.update({ hashKey: "hashKeyValue", sortKey: "v0", updatedFields });

    const expectedResult = {
      TableName: "playbook_versions",
      Key: {},
      ReturnValues: "ALL_NEW",
    };
    expectedResult.Key[config.hashKey] = "hashKeyValue";
    expectedResult.Key[config.sortKey] = "v0";
    expectedResult.UpdateExpression = `SET Latest = if_not_exists(Latest, :defaultval) + :incrval, UpdatedAt = :sfUpdatedAt, test1 = :f0, test2 = :f1`;
    expectedResult.ExpressionAttributeValues = {
      ":defaultval": 0,
      ":incrval": 1,
      ":f0": updatedFields.test1,
      ":f1": updatedFields.test2,
    };
    const expectedUpdatedAt = new Date().toISOString();

    expect(mockedFunctions.update).toHaveBeenCalledWith(
      expect.objectContaining({
        TableName: expectedResult.TableName,
        Key: expectedResult.Key,
        ReturnValues: expectedResult.ReturnValues,
        ExpressionAttributeValues: expect.objectContaining(
          expectedResult.ExpressionAttributeValues
        ),
      }),
      expect.any(Function)
    );
    expect(
      mockedFunctions.update.mock.calls[0][0].ExpressionAttributeValues[
        ":sfUpdatedAt"
      ]
    ).toContain(expectedUpdatedAt.substr(0, 20));
  });

  it("throws error when attempt to update version != v0", () => {
    const config = tableConfigs.playbook_versions;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const updatedFields = {
      test1: "abc",
      test2: 1,
    };

    expect(() =>
      table.update({ hashKey: "hashKeyValue", sortKey: "v1", updatedFields })
    ).toThrow(
      "You can only update records with version 'v0' when table is using versionning."
    );
  });

  it("doesn't throw error when attempt to update version == v0", () => {
    const config = tableConfigs.playbook_versions;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const updatedFields = {
      test1: "abc",
      test2: 1,
    };

    expect(() =>
      table.update({ hashKey: "hashKeyValue", sortKey: "v0", updatedFields })
    ).not.toThrow();
  });

  it("calls resolve when docClient.update is successful", async () => {
    const config = tableConfigs.playbook_versions;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const responseData = { what: "Successful data" };
    mockedFunctions.update.mockImplementation((params, callback) =>
      callback(null, responseData)
    );

    const data = await table.update({
      hashKey: uuid.v4(),
      sortKey: "v0",
      updatedFields: {},
    });
    expect(data).toEqual(responseData);
  });

  it("calls reject when docClient.update fails", async () => {
    const config = tableConfigs.playbook_versions;
    const { mockAWS, mockedFunctions } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const expectedError = "This is my error";
    mockedFunctions.update.mockImplementation((params, callback) =>
      callback(expectedError, null)
    );

    try {
      await table.update({
        hashKey: uuid.v4(),
        sortKey: "v0",
        updatedFields: {},
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
    mockedFunctions.update.mockImplementation((params, callback) => {
      throw expectedError;
    });

    try {
      await table.update({
        hashKey: uuid.v4(),
        sortKey: "v0",
        updatedFields: {},
      });
      fail("Promise.reject wasn't called");
    } catch (err) {
      expect(err).toEqual(expectedError);
    }
  });
});
