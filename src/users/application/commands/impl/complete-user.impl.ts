

export class CompleteUserImpl{
    constructor(
    public id:string,
    public full_name?: string,
    public phone?: string,
    public bio?: string,
    public lat?:number,
    public lng?:number,
    public country?: string,
    public city?: string,
    ){}
}