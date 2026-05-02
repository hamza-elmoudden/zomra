

export class CreateEventsImpl {
    constructor(
        public readonly host_id: string,
        public readonly title: string,
        public readonly category: string,
        public readonly starts_at: Date,

        public readonly duration_minutes: number,
        public readonly max_participants: number,
        public readonly current_count: number,

        public readonly description?: string,
        public readonly address?: string,
        public readonly city?: string,

        public readonly cover_image_url?: string,

        public readonly lat?: number,
        public readonly lng?: number
    ) { }
}