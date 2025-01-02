export interface ConfigDict {
  schema?: {
      [databaseId: number]: {
          engine: string;
          tables: string;
      };
  };
  schemaExtractedAt?: string;
  capabilities?: {
      schema: {
          tables: {
              [tableName: string]: Array<{
                  Field: string;
                  Type: string;
                  [key: string]: any;
              }>;
          };
          relationships: any[];
      };
      visualizations: {
          time_series: string[];
          comparisons: string[];
          [key: string]: string[];
      };
      features: {
          supports_aggregations: boolean;
          supports_filters: boolean;
          [key: string]: boolean;
      };
  };
}

export interface DatabasesSchema {
  [key: number]: {
    engine: string;
    tables: string;
  };
}
