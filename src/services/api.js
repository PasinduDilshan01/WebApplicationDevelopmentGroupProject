import axios from "axios";

const API = axios.create({

    baseURL: "http://localhost/PROJECTS/Cinema-%20Ticket-BookingWebsite/Cinema-Ticket-OnlineBooking/backend/api",

    withCredentials: true,

    headers: {
        "Content-Type": "application/json"
    }

});

export default API;