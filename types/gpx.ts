export interface GPXPoint {
  "@_lat": number;
  "@_lon": number;
  ele?: number;
  time?: string;
  name?: string;
  desc?: string;
  sym?: string;
  type?: string;
}

export interface GPXTrackSegment {
  trkpt: GPXPoint[];
}

export interface GPXTrack {
  name?: string;
  desc?: string;
  trkseg: GPXTrackSegment[];
}

export interface GPXRoute {
  name?: string;
  desc?: string;
  rtept: GPXPoint[];
}

export interface GPXAuthor {
  name?: string;
  email?: string;
  link?: {
    "@_href": string;
    text?: string;
    type?: string;
  };
}

export interface GPXMetadata {
  name?: string;
  desc?: string;
  author?: GPXAuthor;
  time?: string;
  keywords?: string;
}

export interface GPXRoot {
  "@_version": string;
  "@_creator": string;
  "@_xmlns"?: string;
  metadata?: GPXMetadata;
  wpt?: GPXPoint[];
  rte?: GPXRoute[];
  trk?: GPXTrack[];
}

export interface GPXJson {
  gpx: GPXRoot;
}
