import axios, { AxiosRequestConfig } from 'axios'
import { Platform } from 'react-native'
import { footballDataApiKey } from '../config/config'

const FOOTBALL_DATA_API = 'https://api.football-data.org/v4'
const FOOTBALL_DATA_WEB_PROXY = process.env.EXPO_PUBLIC_FOOTBALL_DATA_PROXY_URL

export function footballDataGet<T = any>(
  path: string,
  config: AxiosRequestConfig = {},
) {
  if (Platform.OS === 'web' && !FOOTBALL_DATA_WEB_PROXY) {
    throw new Error(
      'EXPO_PUBLIC_FOOTBALL_DATA_PROXY_URL is required for Football Data on web',
    )
  }

  const baseURL =
    Platform.OS === 'web' ? FOOTBALL_DATA_WEB_PROXY : FOOTBALL_DATA_API
  const headers =
    Platform.OS === 'web'
      ? undefined
      : { ...config.headers, 'X-Auth-Token': footballDataApiKey }

  return axios.get<T>(`${baseURL}/${path.replace(/^\/+/, '')}`, {
    ...config,
    headers,
  })
}
