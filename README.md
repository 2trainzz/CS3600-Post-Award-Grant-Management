# CS3600-Post-Award-Grant-Management

This is a project for Professor Hasan Jamil's CS3600 Databases class. Carla Kolze and Amanda Board work on this project together.

This project is for post-award grant management. After a grant is awarded to a professor, the spending requests can be complicated to keep track of and approve.

This full stack application aims to help solve this problem. The use should be able to log in and make a spending request (if they are the PI on the grant) to a LLM chat box. The request will be sent to an LLM in the backend, along with other necessary information (spending rules, fringe rates, grant amount) in order to make a decision. The decision will be sent back to the program, where it will be escalated among other users who must approve the spending request. An approved request will update how much money is left in the grant.

This app uses React, Vite and Electron for the front end. The backend is supported via Express js API. It also uses Prisma (an ORM) to contact the database in MySQL. Lastly, it utilizes Gemini Flash 2.5 as the LLM and Google AI SDK as the API for the LLM.

to build app: npm run build, npm run dev

to see prisma schema: npm run prisma:studio
