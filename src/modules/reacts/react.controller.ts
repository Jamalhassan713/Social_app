import { Router } from "express";
import { authentication } from "../../middlewares";
import reactService from "./services/react.service";
const reactController = Router()

//add react 
reactController.post('/add-react', authentication, reactService.addReact)

// update react 
reactController.put('/update-react', authentication, reactService.updateReact)

// delete react 


//get react with id
reactController.get('/get-react-with-id/:id', authentication, reactService.getReactWithId)


export { reactController }