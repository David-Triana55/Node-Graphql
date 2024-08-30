import { ApolloServer, UserInputError, gql } from "apollo-server";
import "./db.js";
import Person from "./models/person.js";

// Define the schema using the GraphQL schema language

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
    allPersons: [Person]! 
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
`;
// Define the resolvers for the schema fields
const resolvers = {
	// these are the queries we created for each case
	Query: {
		personCount: () => Person.collection.countDocuments(),
		allPersons: async (root, args) => {
			try {
				const persons = await Person.find({});
				return persons;
			} catch (error) {
				console.error("Error fetching persons:", error.message);
				throw new Error("Could not fetch persons");
			}
		},
		findPerson: async (root, args) => {
			try {
				const { name } = args;
				const person = await Person.findOne({ name });
				if (!person) return null;
				return person;
			} catch (error) {
				console.error("Error fetching persons:", error.message);
				throw new Error("Could not fetch persons data");
			}
		},
	},
	Mutation: {
		addPerson: (root, args) => {
			const person = new Person({ ...args });
			person.save();

			return person;
		},

		editPerson: async (root, args) => {
			const { name, phone, city, street } = args;
			const person = await Person.findOne({ name });
			if (!person) return null;
			person.phone = phone;
			person.city = city;
			person.street = street;
			return person.save();
		},

		deletePerson: async (root, args) => {
			try {
				const { name } = args;
				const person = await Person.findOneAndDelete({ name });
				if (!person) {
					throw new UserInputError("Person not found");
				}
				return person;
			} catch (error) {
				console.error("Error deleting person:", error.message);
				throw new Error("Could not delete person");
			}
		},
	},

	// these are the resolvers for the fields in the Person type
	Person: {
		address: (root) => {
			return {
				street: root.street,
				city: root.city,
			};
		},
	},
};
// Create an instance of ApolloServer
const server = new ApolloServer({
	typeDefs,
	resolvers,
});
// Start the server
server.listen().then(({ url }) => {
	console.log(`Server ready at ${url}`);
});
