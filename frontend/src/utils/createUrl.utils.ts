type CreateUrl = {
  url: string;
  parameters?: { [key: string]: string };
};

export function createUrl({ url, parameters }: CreateUrl) {
  let queryParameters = ``;
  if (parameters) {
    queryParameters = new URLSearchParams(parameters).toString();
  }

  return `${url}?${queryParameters}`;
}
