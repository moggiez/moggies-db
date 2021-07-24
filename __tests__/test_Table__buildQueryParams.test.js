const { Table } = require("../index");
const { mockAWSLib, tableConfigs } = require("./helpers");

describe("Table._buildQueryParams", () => {
  it("build query when only hashKey given", () => {
    const config = tableConfigs.loadtests;
    const { mockAWS, _ } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const result = table._buildQueryParams(null, "hashKeyValue");
    const expectedResult = {
      TableName: "loadtests",
      KeyConditionExpression: "#pk = :pkv",
      ExpressionAttributeNames: { "#pk": config.hashKey },
      ExpressionAttributeValues: {
        ":pkv": "hashKeyValue",
      },
    };
    expect(result).toStrictEqual(expectedResult);
  });

  it("build query when hashKey and sortKey given", () => {
    const config = tableConfigs.loadtests;
    const { mockAWS, _ } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const result = table._buildQueryParams(
      null,
      "hashKeyValue",
      "sortKeyValue"
    );
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
      },
    };
    expect(result).toStrictEqual(expectedResult);
  });

  it("build query when indexName and hashKey given", () => {
    const config = tableConfigs.loadtests;
    const { mockAWS, _ } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const indexName = "PlaybookLoadtestIndex";

    const result = table._buildQueryParams(indexName, "hashKeyValue");
    const expectedResult = {
      TableName: "loadtests",
      IndexName: indexName,
      KeyConditionExpression: "#pk = :pkv",
      ExpressionAttributeNames: {
        "#pk": config.indexes[indexName].hashKey,
      },
      ExpressionAttributeValues: {
        ":pkv": "hashKeyValue",
      },
    };
    expect(result).toStrictEqual(expectedResult);
  });

  it("build query when indexName, hashKey and sortKey given", () => {
    const config = tableConfigs.loadtests;
    const { mockAWS, _ } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const indexName = "PlaybookLoadtestIndex";

    const result = table._buildQueryParams(
      indexName,
      "hashKeyValue",
      "sortKeyValue"
    );
    const expectedResult = {
      TableName: "loadtests",
      IndexName: indexName,
      KeyConditionExpression: "#pk = :pkv and #skv = :skv",
      ExpressionAttributeNames: {
        "#pk": config.indexes[indexName].hashKey,
        "#skv": config.indexes[indexName].sortKey,
      },
      ExpressionAttributeValues: {
        ":pkv": "hashKeyValue",
        ":skv": "sortKeyValue",
      },
    };
    expect(result).toStrictEqual(expectedResult);
  });

  it("build query when key condition and filter provided", () => {
    const config = tableConfigs.loadtests;
    const { mockAWS, _ } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const filter = {
      expression: "Active = :active",
      attributes: {
        active: 1,
      },
    };

    const result = table._buildQueryParams(
      null,
      "hashKeyValue",
      "sortKeyValue",
      filter
    );
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
    expect(result).toStrictEqual(expectedResult);
  });

  it("build query when indexName, key condition and filter provided", () => {
    const config = tableConfigs.loadtests;
    const { mockAWS, _ } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const filter = {
      expression: "Active = :active",
      attributes: {
        active: 1,
      },
    };

    const indexName = "UsersLoadtestsIndex";
    const result = table._buildQueryParams(
      indexName,
      "hashKeyValue",
      "sortKeyValue",
      filter
    );
    const expectedResult = {
      TableName: "loadtests",
      IndexName: indexName,
      KeyConditionExpression: "#pk = :pkv and #skv = :skv",
      ExpressionAttributeNames: {
        "#pk": config.indexes[indexName].hashKey,
        "#skv": config.indexes[indexName].sortKey,
      },
      ExpressionAttributeValues: {
        ":pkv": "hashKeyValue",
        ":skv": "sortKeyValue",
        ":active": filter.attributes.active,
      },
      FilterExpression: filter.expression,
    };
    expect(result).toStrictEqual(expectedResult);
  });

  it("build query with all filter expression attribute values", () => {
    const config = tableConfigs.loadtests;
    const { mockAWS, _ } = mockAWSLib();
    const table = new Table({ config: config, AWS: mockAWS });

    const filter = {
      expression: "Active = :active and Year = :this_year",
      attributes: {
        active: 1,
        this_year: 2021,
      },
    };

    const result = table._buildQueryParams(
      null,
      "hashKeyValue",
      "sortKeyValue",
      filter
    );
    Object.entries(filter.attributes).forEach(([key, value], _) => {
      const property = `:${key}`;
      expect(result.ExpressionAttributeValues).toHaveProperty(property);
      expect(result.ExpressionAttributeValues[property]).toBe(value);
    });
  });
});
