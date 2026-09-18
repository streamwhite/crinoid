export interface IpcChannel<Request, Response> { readonly name: string; readonly validate: (value: unknown) => value is Request; readonly respond: (value: Response) => Response }
export function createChannel<Request, Response>(name: string, validate: (value: unknown) => value is Request): IpcChannel<Request, Response> { return { name, validate, respond: (value) => value } }
