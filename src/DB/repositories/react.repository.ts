import { IReact } from "../../common";
import { reactModel } from "../models/react.modle";
import { baseRepository } from "./base.repository";



export class reactRepository extends baseRepository<IReact> {
    constructor() {
        super(reactModel)
    }
}