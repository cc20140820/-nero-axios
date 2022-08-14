import axios, { type AxiosInstance } from 'axios'
import { Notyf } from 'notyf'
import 'notyf/notyf.min.css'

import { baseURLs } from './base-urls'
import { defaultOptions } from './options'
import type {
  Options,
  RequestOptions,
  Response,
  RedirectParams,
  UploadOptions,
  UploadConfig,
  UploadedResource
} from './typings'
import './axios.css'

const notyf = new Notyf({
  position: {
    x: 'center',
    y: 'top'
  },
  duration: 3000
})

export class Axios {
  private axios: AxiosInstance

  private opts: Options

  constructor(options: Options = {}) {
    this.opts = {
      ...defaultOptions,
      ...options
    }

    const { mode, gateway, prefix, unauthorizedHandler, ...axiosConfig } =
      this.opts

    this.axios = axios.create(axiosConfig)

    this.axios.interceptors.request.use(
      (config) => {
        // prefix rewrite
        if (config.url && typeof this.opts.prefix === 'string') {
          config.url = [this.opts.prefix, config.url].join('')
        } else if (config.url && typeof this.opts.prefix === 'object') {
          const prefix = config.url.match(/\/([^/]+)/)?.shift()
          if (prefix && this.opts.prefix[prefix]) {
            config.url = config.url.replace(prefix, this.opts.prefix[prefix])
          }
        }

        return config
      },
      (error) => {
        console.error(error)
        return Promise.reject(error)
      }
    )

    this.axios.interceptors.response.use(
      (response) => {
        return response
      },
      (error) => {
        console.error(error)
        notyf.error(error.message || '请求异常!')
        return Promise.reject(error)
      }
    )
  }

  async request<R = any, D = any>(options: RequestOptions<D>): Promise<R> {
    const {
      baseURL,
      mode = this.opts.mode,
      gateway = this.opts.gateway,
      unauthorizedHandler = this.opts.unauthorizedHandler,
      ...axiosConfig
    } = options

    const response = await this.axios.request<Response<R>>({
      ...axiosConfig,
      baseURL: baseURL || (gateway && mode && baseURLs[gateway]?.[mode])
    })

    // if the custom code is not 200, it is judged as an error.
    if (response.data.code === 200 || response.data.error === 0) {
      return Promise.resolve(response.data.data)
    }

    if (response.data.code === 401) {
      if (typeof unauthorizedHandler === 'function') {
        unauthorizedHandler(response.data)
      } else if (['optGateway', 'h5Gateway'].includes(gateway!)) {
        const {
          casLoginUrl,
          appSecurityUrl,
          appRedirectParameter,
          casServiceParameter
        } = response.data.data as unknown as RedirectParams

        const login = `${casLoginUrl}?${casServiceParameter}=${encodeURIComponent(
          `${appSecurityUrl}?${appRedirectParameter}=${encodeURIComponent(
            window.location.href
          )}`
        )}`
        window.open(login, '_self')
      }
    }

    notyf.error(response.data?.resultMessage || '服务异常!')

    return Promise.reject(response.data)
  }

  async get<R = any, D = any>(
    url: string,
    options: Omit<RequestOptions<D>, 'url' | 'method'> = {}
  ): Promise<R> {
    return this.request<R, D>({
      ...options,
      url,
      method: 'GET'
    })
  }

  async delete<R = any, D = any>(
    url: string,
    options: Omit<RequestOptions<D>, 'url' | 'method'> = {}
  ): Promise<R> {
    return this.request<R, D>({
      ...options,
      url,
      method: 'DELETE'
    })
  }

  async head<R = any, D = any>(
    url: string,
    options: Omit<RequestOptions<D>, 'url' | 'method'> = {}
  ): Promise<R> {
    return this.request<R, D>({
      ...options,
      url,
      method: 'HEAD'
    })
  }

  async options<R = any, D = any>(
    url: string,
    options: Omit<RequestOptions<D>, 'url' | 'method'> = {}
  ): Promise<R> {
    return this.request<R, D>({
      ...options,
      url,
      method: 'OPTIONS'
    })
  }

  async post<R = any, D = any>(
    url: string,
    data?: D,
    options: Omit<RequestOptions<D>, 'url' | 'method' | 'data'> = {}
  ): Promise<R> {
    return this.request<R, D>({
      ...options,
      url,
      method: 'POST',
      data
    })
  }

  async put<R = any, D = any>(
    url: string,
    data?: D,
    options: Omit<RequestOptions<D>, 'url' | 'method' | 'data'> = {}
  ): Promise<R> {
    return this.request<R, D>({
      ...options,
      url,
      method: 'PUT',
      data
    })
  }

  async patch<R = any, D = any>(
    url: string,
    data?: D,
    options: Omit<RequestOptions<D>, 'url' | 'method' | 'data'> = {}
  ): Promise<R> {
    return this.request<R, D>({
      ...options,
      url,
      method: 'PATCH',
      data
    })
  }

  async upload(options: UploadOptions) {
    const { client = 'web_100', ...axiosConfig } = options

    if (!options?.data) {
      throw new Error('Upload data cannot be empty.')
    }

    if (this.opts.gateway !== 'optGateway') {
      throw new Error('Only optGateway support uploading.')
    }

    const config = await this.get<UploadConfig>(
      '/static-resource/static/policy',
      {
        gateway: 'optGateway',
        params: {
          client
        }
      }
    )

    const file = options.data
    const [, Filename, ext] = file.name?.match(/^(.*)(\.[\w\d]+$)/) ?? []
    const timestamp = new Date().getTime()
    const hash = Math.random().toString(36).substring(2)

    const remoteFile = `${config.fileNamePrefix}${Filename}_${timestamp}_${hash}${ext}`
    const data = new FormData()
    data.append('key', remoteFile)
    data.append('OSSAccessKeyId', config.accessid)
    data.append('policy', config.policy)
    data.append('signature', config.signature)
    data.append('callback', config.callback)
    data.append('success_action_status', '200')
    data.append('file', file)

    return this.post<UploadedResource>(config.host, data, {
      withCredentials: false,
      ...axiosConfig
    })
  }
}
