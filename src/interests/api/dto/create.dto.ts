import { IsNotEmpty, IsOptional, IsString, isString } from "class-validator";



export class CreateDto {

    @IsString()
    @IsNotEmpty()
    name:string;

    @IsString()
    @IsOptional()
    icon:string;

    @IsString()
    @IsOptional()
    color_hex:string
}