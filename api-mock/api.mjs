import { Router } from "express"

const api = Router()

api.post("/getContactsWithMessages", (request, response) => {
  response.contentType("application/json")
  response.send([
    {
      user: {
        id: 1,
        name: "John",
        avatarURL: "https://fastly.picsum.photos/id/903/50/50.jpg?hmac=KOpCpZY7_zRGpVsF5FCfJnWk_f24Cy-5ROIOIDDYN0E"
      },
      messages: []
    },
    {
      user: {  
        id: 2,
        name: "Jack",
        avatarURL: "https://fastly.picsum.photos/id/174/50/50.jpg?hmac=mW6r1Zub6FvIFJsQBfPRVHD6r1n980M8y7kpNQ3scFI"
      },
      messages: []
    },
    {
      user: {  
        id: 3,
        name: "Paul",
        avatarURL: "https://fastly.picsum.photos/id/649/50/50.jpg?hmac=1DvRtR-LwNXehtjiit4CTZU6D6nXcN_aI6TqMwkw8PU"
      },
      messages: []
    },
  ])
})

export default api