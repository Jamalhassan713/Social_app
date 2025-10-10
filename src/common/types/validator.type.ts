import z from "zod";
import { signUpValidator } from "../../validators";

export type signUpBodyType=z.infer <typeof signUpValidator.body>