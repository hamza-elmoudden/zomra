import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { GetAllInterestsImpl } from "../application/queries/impl/getall.interests.impl";
import { CreateDto } from "./dto/create.dto";
import { Roles } from "src/auth/decorators/decorators";
import { AuthGuard } from "@nestjs/passport";
import { CreateInterestsImpl } from "../application/commands/impl/create.interests.impl";
import { DeleteInterestsImpl } from "../application/queries/impl/delete.interests.impl";
import { GetInterestByIdImpl } from "../application/queries/impl/get.interestsByid.impl";


@Controller('interests')
export class InterestsController{
    constructor(
        private readonly commandBus:CommandBus,
        private readonly queryBus:QueryBus
    ){}



    @Get('all')
    async getallInterests(){
        return await this.queryBus.execute(new GetAllInterestsImpl())
    }


    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    async getById(@Param('id') id:number){
        return await this.queryBus.execute(new GetInterestByIdImpl(id))
    }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    @Roles('admin')
    async create(@Body() data:CreateDto){
        return await this.commandBus.execute(new CreateInterestsImpl(data.name,data.icon,data.color_hex))
    }


    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @Roles('admin')
    async delete(@Param("id") id:number,@Req() req:any){

        return await this.queryBus.execute(new DeleteInterestsImpl(req.user.id,id))

    }


}