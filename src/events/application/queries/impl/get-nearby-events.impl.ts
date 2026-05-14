export class GetNearbyEventsImpl {
  constructor(
    public readonly lat: number,
    public readonly lng: number,
    public readonly radiusKm?: number,
  ) {}
}
