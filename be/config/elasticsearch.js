import environment from "./environment.js";

const buildElasticsearchUrl = (pathname) => {
  if (!environment.elasticsearch_url) {
    throw new Error("ELASTICSEARCH_URL is required");
  }

  return new URL(pathname, environment.elasticsearch_url).toString();
};

export const elasticsearchRequest = async (pathname, options = {}) => {
  if (!environment.elastic_api_key) {
    throw new Error("ELASTIC_API_KEY is required");
  }

  const { timeoutMs = 10000, ...fetchOptions } = options;

  const response = await fetch(buildElasticsearchUrl(pathname), {
    ...fetchOptions,
    signal: fetchOptions.signal || AbortSignal.timeout(timeoutMs),
    headers: {
      Authorization: `ApiKey ${environment.elastic_api_key}`,
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error?.reason || data?.error?.type || "Elasticsearch request failed";
    const error = new Error(message);
    error.statusCode = response.status;
    error.type = data?.error?.type;
    throw error;
  }

  return data;
};

export const checkElasticsearchConnection = () => elasticsearchRequest("/");
