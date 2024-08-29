import { ApolloServer, gql, UserInputError } from 'apollo-server'
import axios from 'axios'
import { stringify, v1 as uuid } from 'uuid'

// Define the schema using the GraphQL schema language

// const persons = [
//   {
//     name: 'John',
//     lastName: 'Doe',
//     phone: '123-456-7890',
//     street: '123 Elm St',
//     city: 'Springfield',
//     id: 1
//   },
//   {
//     name: 'Jane',
//     lastName: 'Doe',
//     phone: '123-456-7890',
//     street: '123 Elm St',
//     city: 'Springfield',
//     id: 2
//   }, 
//   {
//     name: 'Billy',
//     lastName: 'Bob',
//     street: '123 Elm St',
//     city: 'Springfield',
//     id: 3
//   }
// ]
// Define the type definitions for the schema
// -> ! means that this field can never be null
// -> [person] means that this field is a list of persons
// -> (name:String!): Person -> this query takes a parameter name and returns a person 
// -> :Person means that this query returns a person object
const typeDefs = gql`

  enum YesNo {
    YES
    NO
  }

  type Adress {
    street: String!
    city: String!
  }

  type Person {
    name: String!
    phone: String
    address: Adress!
    id: ID!
  }

  type Query {
    personCount: Int! 
    allPersons(phone: YesNo): [Person]! 
    findPerson(name:String!): Person 
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String!
      street: String!
      city: String!
    ): Person

    editPerson(
      name: String!
      phone: String!
      city: String!
      street: String!
      ) : Person
      deletePerson(
        name: String!
        ): Person
  }
`
// Define the resolvers for the schema fields
const resolvers = {
  // these are the queries we created for each case
  Query: {
    personCount: async () => {
      try {
        const { data: personsFromApi } = await axios.get("http://localhost:3000/persons");
        return personsFromApi.length;
      } catch (error) {
        console.error("Error fetching persons:", error.message);
        throw new Error("Could not fetch persons data");
      }
    }
    ,
    allPersons: async (root, args) => {
      const {data: personsFromApi } = await axios.get('http://localhost:3000/persons')
      console.log(JSON.stringify(personsFromApi, null, 2)); // Usar JSON.stringify para evitar problemas de referencia circular en el registro
      // if there is no phone argument, return all persons we used enum
      if(!args.phone) return personsFromApi
      const byPhone = (personsFromApi) => args.phone === 'YES' ? personsFromApi.phone : !personsFromApi.phone
      return personsFromApi.filter(byPhone)

    },
    findPerson: async (root, args) =>{
      try {
        const {data: personsFromApi } = await axios.get("http://localhost:3000/persons")

        return personsFromApi.find(p => p.name === args.name)
      } catch (error) {
        console.error("Error fetching persons:", error.message)
        throw new Error("Could not fetch persons data")
      }
    }
  },
  Mutation: {
    addPerson: async (root, args) => {
      const {data : personsFromApi} = await axios.get('http://localhost:3000/persons')
      // check if the person already exists
      if(personsFromApi.find(p => p.name === args.name)){
        throw new UserInputError('Name must be unique', {
          invalidArgs: args.name
        })
      }

      const person = { ...args, id: uuid() }
      
      // personsFromApi.push(person)
      await axios.post('http://localhost:3000/persons', person).then(res => {
        console.log(res)
      })
      return person
    },

    editPerson: async (root, args) => {
      try {
        const { name, phone, city, street } = args;
        const { data: personsFromApi } = await axios.get('http://localhost:3000/persons');

        const personIndex = personsFromApi.findIndex(p => p.name === name);
        if (personIndex === -1) return null;

        // Asegúrate de actualizar solo el objeto que necesitas
        const updatedPerson = { ...personsFromApi[personIndex], phone: phone, city: city, street: street };

        // Actualiza en el servidor remoto
        await axios.put(`http://localhost:3000/persons/${personsFromApi[personIndex].id}`, updatedPerson);

        return updatedPerson;
      } catch (error) {
        console.error("Error fetching persons:", error.message);
        throw new Error("Could not fetch persons data");
      }
    },
    deletePerson: async (root, args) => {
      try {
        const { name } = args;
        const { data: personsFromApi } = await axios.get('http://localhost:3000/persons');

        const personIndex = personsFromApi.findIndex(p => p.name === name);
        if (personIndex === -1) return null;

        // Elimina en el servidor remoto
        await axios.delete(`http://localhost:3000/persons/${personsFromApi[personIndex].id}`);

        return personsFromApi[personIndex];
      } catch (error) {
        console.error("Error fetching persons:", error.message);
        throw new Error("Could not fetch persons data");
      }
    }
  },

  // these are the resolvers for the fields in the Person type
  Person: {
    address: (root) => {
      return {
        street: root.street,
        city: root.city}
    }
  }
}
// Create an instance of ApolloServer
const server = new ApolloServer({
  typeDefs,
  resolvers
})
// Start the server
server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
