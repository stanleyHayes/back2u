declare module 'supercluster' {
  type BBox = [number, number, number, number];

  interface PointFeatureDef<P extends object = object> {
    type: 'Feature';
    properties: P;
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
  }

  interface ClusterFeatureDef<C extends object = object> {
    type: 'Feature';
    properties: C & {
      cluster: true;
      cluster_id: number;
      point_count: number;
    };
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
  }

  export interface Options<P extends object, C extends object> {
    minZoom?: number;
    maxZoom?: number;
    minPoints?: number;
    radius?: number;
    extent?: number;
    nodeSize?: number;
    log?: boolean;
    generateId?: boolean;
    map?: (props: P) => C;
    reduce?: (accumulated: C, props: C) => void;
  }

  class Supercluster<P extends object = object, C extends object = object> {
    constructor(options?: Options<P, C>);
    load(points: PointFeatureDef<P>[]): this;
    getClusters(bbox: BBox, zoom: number): (PointFeatureDef<P> | ClusterFeatureDef<C>)[];
    getChildren(clusterId: number): (PointFeatureDef<P> | ClusterFeatureDef<C>)[];
    getLeaves(clusterId: number, limit?: number, offset?: number): PointFeatureDef<P>[];
    getClusterExpansionZoom(clusterId: number): number;
  }

  namespace Supercluster {
    export type PointFeature<P extends object = object> = PointFeatureDef<P>;
    export type ClusterFeature<C extends object = object> = ClusterFeatureDef<C>;
  }

  export = Supercluster;
}
