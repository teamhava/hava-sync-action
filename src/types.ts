/**
 * Result wraper type
 */
export type HavaResult = {
  Success: boolean
  Message: string
}

export interface View {
  id: string
  type: string
  image_name: string
  image_url: string
  export_timestamp: number
  revision_id: string
  regions: string[]
  empty: boolean
  resources: CurrentRevision[]
}

export interface CurrentRevision {
  id: string
}

export interface Job {
  job_id: string
}
