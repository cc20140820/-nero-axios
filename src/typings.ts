import { type AxiosRequestConfig } from 'axios'
import { baseURLs } from './base-urls'

export type Gateway = keyof typeof baseURLs

export type Mode = keyof typeof baseURLs[Gateway]

type SharedOptions<D = any> = AxiosRequestConfig<D>

export interface Options<D = any> extends SharedOptions<D> {
  mode?: Mode
  gateway?: Gateway
  // url = base url + prefix + request url
  prefix?: string | Record<string, string>
  unauthorizedHandler?(params: unknown): void
}

export interface RequestOptions<D = any> extends SharedOptions<D> {
  mode?: Mode
  gateway?: Gateway
  unauthorizedHandler?(params: unknown): void
}

export interface UploadOptions extends SharedOptions<File> {
  client?: string
}

export interface Response<T> {
  code: number
  error: number
  data: T
  resultMessage?: string
}

export interface RedirectParams {
  casLoginUrl: string
  appSecurityUrl: string
  appRedirectParameter: string
  casServiceParameter: string
}

export interface UploadConfig {
  host: string
  fileNamePrefix: string
  accessid: string
  policy: string
  signature: string
  callback: string
}

export interface UploadedResource {
  url: string
  fileName: string
  serialNo: string
  mimeType: string
  resourceType: string
  fundationReferSerialNo: string
}
