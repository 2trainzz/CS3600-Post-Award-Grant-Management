# CS3600-Post-Award-Grant-Management

This is a project for Professor Hasan Jamil's CS3600 Databases class. Carla Kolze and Amanda Board work on this project together.

This project is for post-award grant management. After a grant is awarded to a professor, the spending requests can be complicated to keep track of and approve.

This full stack application aims to help solve this problem. The use should be able to log in and make a spending request (if they are the PI on the grant) to a LLM chat box. The request will be sent to an LLM in the backend, along with other necessary information (spending rules, fringe rates, grant amount) in order to make a decision. The decision will be sent back to the program, where it will be escalated among other users who must approve the spending request. An approved request will update how much money is left in the grant.

This app uses React, Vite and Electron for the front end. The backend is supported via Express js API. It also uses Prisma (an ORM) to contact the database in MySQL. Lastly, it utilizes Groq as the LLM and the Groq free API as the API for the LLM.

We use node.js as the environment. To run this project, you must have node.js and npm. You also need MySQL (we use it locally), and to generate a Groq API key. Create a .env in your root directory with your Groq API key and MySQL information. Use npm to install any other dependencies with npm install.

To setup, update, and seed database:
npm run prisma:generate

npm run prisma:migrate

npx prisma db seed

To see prisma schema: npm run prisma:studio

To build app: npm run dev
