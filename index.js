const versionRegex = /v[0-9]+/g;
class Table {
  constructor({ config, AWS }) {
    this.config = config;

    let env = "prod";
    let awsConfig = {};
    try {
      env = process.env.env;
      if (env == "local") {
        awsConfig[
          "endpoint"
        ] = `http://${process.env.LOCALSTACK_HOSTNAME}:4566`;
      }
    } catch (errEnv) {
      console.log("Unable to retrieve 'env'", errEnv);
    }
    this.docClient = new AWS.DynamoDB.DocumentClient(awsConfig);
  }

  _buildBaseParams(hashKey, sortKey) {
    let params = {
      TableName: this.config.tableName,
      Key: {},
    };
    params.Key[this.config.hashKey] = hashKey;
    params.Key[this.config.sortKey] = sortKey;

    return params;
  }

  /**
   *
   * @param {*} indexName Secondary index name
   * @param {*} hashKey Value of the hash key
   * @param {*} sortKey Value of the sort key
   * @param {*} filter Filter object with 2 properties:
   *  'expression' which should be a filter expression
   *  'attributes' which should be an object where each property is a value in the filter expression
   *  Example:
   *  {
   *    expression: 'Active = :active:',
   *    attributes: {
   *      active: 1
   *    }
   *  }
   * @returns
   */
  _buildQueryParams(indexName, hashKey, sortKey, filter) {
    const params = {
      TableName: this.config.tableName,
      KeyConditionExpression: "#pk = :pkv",
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {
        ":pkv": hashKey,
      },
    };

    if (indexName) {
      params.IndexName = indexName;
      params.ExpressionAttributeNames["#pk"] =
        this.config.indexes[indexName].hashKey;

      if (sortKey) {
        params.KeyConditionExpression += " and #skv = :skv";
        params.ExpressionAttributeNames["#skv"] =
          this.config.indexes[indexName].sortKey;
        params.ExpressionAttributeValues[":skv"] = sortKey;
      }
    } else {
      params.ExpressionAttributeNames["#pk"] = this.config.hashKey;

      if (sortKey) {
        params.KeyConditionExpression += " and #skv = :skv";
        params.ExpressionAttributeNames["#skv"] = this.config.sortKey;
        params.ExpressionAttributeValues[":skv"] = sortKey;
      }
    }

    if (filter) {
      params.FilterExpression = filter.expression;
      Object.entries(filter.attributes).forEach(([key, value], _) => {
        params.ExpressionAttributeValues[`:${key}`] = value;
      });
    }

    return params;
  }

  getConfig() {
    return this.config;
  }

  get({ hashKey, sortKey }) {
    return new Promise((resolve, reject) => {
      try {
        const params = this._buildBaseParams(hashKey, sortKey);
        this.docClient.get(params, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } catch (exc) {
        reject(exc);
      }
    });
  }

  /**
   * Queries for items
   * @param {*} hashKey Hash key of the table
   * @param {*} sortKey Sort key of the table
   * @param {*} filter Filter object. Should contain 'expression' and 'attributes' properties.
   * @returns A promise which should resolve with data fetched by using the argument provided or an error
   */
  query({ hashKey, sortKey, indexName, filter }) {
    return new Promise((resolve, reject) => {
      try {
        const params = this._buildQueryParams(
          indexName,
          hashKey,
          sortKey,
          filter
        );

        this.docClient.query(params, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } catch (exc) {
        reject(exc);
      }
    });
  }

  create({ hashKey, sortKey, record }) {
    const isVersionned = this.config.tableName.endsWith("_versions");
    if (isVersionned && !sortKey.match(versionRegex)) {
      throw new Error(
        `Sort key '${sortKey}' doesn't match expected pattern ${versionRegex}`
      );
    }
    return new Promise((resolve, reject) => {
      try {
        let params = this._buildBaseParams(hashKey, sortKey);
        delete params.Key;

        const dateStr = new Date().toISOString();
        params.Item = record;
        params.Item["UpdatedAt"] = dateStr;

        if (isVersionned) {
          params.Item["Latest"] = 0;
        } else {
          params.Item["CreatedAt"] = dateStr;
        }

        params.Item[this.config.hashKey] = hashKey;
        params.Item[this.config.sortKey] = sortKey;
        params.ReturnValues = "ALL_NEW";
        this.docClient.put(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } catch (exc) {
        reject(exc);
      }
    });
  }

  update({ hashKey, sortKey, updatedFields }) {
    const record = { ...updatedFields };
    const isVersionned = this.config.tableName.endsWith("_versions");
    if (isVersionned && sortKey != "v0") {
      throw new Error(
        "You can only update records with version 'v0' when table is using versionning."
      );
    }
    return new Promise((resolve, reject) => {
      try {
        if ("CreatedAt" in record) delete record["CreatedAt"];
        if ("UpdatedAt" in record) delete record["UpdatedAt"];
        let params = this._buildBaseParams(hashKey, sortKey);
        params.UpdateExpression = `SET ${
          isVersionned
            ? "Latest = if_not_exists(Latest, :defaultval) + :incrval,"
            : ""
        } UpdatedAt = :sfUpdatedAt,`;
        params.ExpressionAttributeValues = {
          ":sfUpdatedAt": new Date().toISOString(),
        };

        if (isVersionned) {
          params.ExpressionAttributeValues[":defaultval"] = 0;
          params.ExpressionAttributeValues[":incrval"] = 1;
        }

        params.ReturnValues = "ALL_NEW";

        Object.entries(record).forEach((element, index, array) => {
          const fieldName = element[0];
          const fieldNewValue = element[1];
          const valuePlaceholder = `:f${index}`;
          params.UpdateExpression += ` ${fieldName} = ${valuePlaceholder}${
            index + 1 < array.length ? "," : ""
          }`;
          params.ExpressionAttributeValues[valuePlaceholder] = fieldNewValue;
        });

        this.docClient.update(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } catch (exc) {
        reject(exc);
      }
    });
  }

  delete({ hashKey, sortKey }) {
    return new Promise((resolve, reject) => {
      try {
        const params = this._buildBaseParams(hashKey, sortKey);
        this.docClient.delete(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } catch (ex) {
        reject(ex);
      }
    });
  }
}

exports.Table = Table;
