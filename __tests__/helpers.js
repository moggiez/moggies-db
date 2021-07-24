const mockAWSLib = () => {
  const mockGet = jest.fn();
  const mockQuery = jest.fn();
  const mockPut = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockConstructor = jest.fn();

  const mockDocClient = class C {
    constructor(options) {
      mockConstructor(options);
    }
    get = mockGet;
    query = mockQuery;
    put = mockPut;
    update = mockUpdate;
    delete = mockDelete;
  };

  const mockAWS = {
    DynamoDB: {
      DocumentClient: mockDocClient,
    },
  };

  return {
    mockAWS,
    mockedFunctions: {
      documentClientConstructor: mockConstructor,
      get: mockGet,
      query: mockQuery,
      put: mockPut,
      update: mockUpdate,
      delete: mockDelete,
    },
  };
};

exports.mockAWSLib = mockAWSLib;
exports.tableConfigs = {
  loadtests: {
    tableName: "loadtests",
    hashKey: "OrganisationId",
    sortKey: "LoadtestId",
    indexes: {
      PlaybookLoadtestIndex: {
        hashKey: "PlaybookId",
        sortKey: "LoadtestId",
      },
      UsersLoadtestsIndex: {
        hashKey: "UserId",
        sortKey: "LoadtestId",
      },
      CreatedAtHourIndex: {
        hashKey: "CreatedAtHour",
        sortKey: "MetricsSavedDate",
      },
    },
  },
  playbook_versions: {
    tableName: "playbook_versions",
    hashKey: "PlaybookId",
    sortKey: "Version",
    indexes: {
      OrganisationPlaybooks: {
        hashKey: "OrganisationId",
        sortKey: "PlaybookId",
      },
    },
  },
  organisations: {
    tableName: "organisations",
    hashKey: "OrganisationId",
    sortKey: "UserId",
    indexes: {
      UserOrganisations: {
        hashKey: "UserId",
        sortKey: "OrganisationId",
      },
    },
  },
  domains: {
    tableName: "domains",
    hashKey: "OrganisationId",
    sortKey: "DomainName",
  },
  loadtest_metrics: {
    tableName: "loadtest_metrics",
    hashKey: "LoadtestId",
    sortKey: "MetricName",
  },
};
