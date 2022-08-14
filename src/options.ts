import qs from 'qs'
import { type Options } from './typings'

export const defaultOptions: Options = {
  timeout: 5000,
  paramsSerializer: (params) => qs.stringify(params)
}
