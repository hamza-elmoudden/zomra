import { IsNotEmpty, IsOptional, IsString, isString, MaxLength, MinLength } from "class-validator";



export class CreateDto {

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @MinLength(2)
    name:string;

    @IsString()
    @IsOptional()
    @MinLength(2)
    icon:string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    @MinLength(4)
    color_hex:string
}