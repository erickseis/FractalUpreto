import { GraphQLServer, PubSub } from "graphql-yoga";
import { v1 as uuid } from 'uuid'
import { UserInputError } from 'apollo-server'


const SUBSCRIPTION_EVENTS = {
  PERSON_ADDED: "ERSON_ADDED"
}

const pubsub = new PubSub();

//Data
const persons = [
  {
    name: "Erick",
    phone: "+56-997903178",
    street: "Calle Cartagena",
    city: "Arica",
    id: "3sdsad15-5465484-456464-454456"
  },
  {
    name: "Jose",
    street: "Calle Olivo",
    city: "Trujillo",
    id: "5465484-456464-4253464-454456"
  },
  {
    name: "Aida",
    phone: "+58-412589140",
    street: "Calle Bolivar",
    city: "Valencia",
    id: "e4558fd-lo847-zxc015-po26565"
  },
]

//Defined Querys
const typeDefs = `
type Address{
  street: String!
  city: String!
}

type Person {
  name: String! 
  phone: String
  address: Address!
  id: ID!
}
type Query{
personCount: Int!
allPersons: [Person]!
findPerson(name: String!): Person
}

type Mutation {
  addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
  ): Person
}

type Subscription {
  personAdded: Person!
}
`;
//Resolvers

const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: () => persons,// da todas las peronas
    findPerson: (root, args) => { // para buscar personas  una por una por su nombre
      const { name } = args
      return persons.find(person => person.name === name) // con este metodo sino encuentra el parametro que le estoy pasando  como string devolvera un null

    },

  },
  Mutation: {
    addPerson: (root, args) => {
      if (persons.find(p => p.name === args.name)) {
        throw new UserInputError('Name must be unique', {
          invalidArgs: args.name // para controlar que no tengamos persona con el mismo nombre y q no arroje un error de servidor
        }) //para validar que no se repita algun valor
      }
      // const { name, phone, street, city } = args
      const person = { ...args, id: uuid() }
      persons.push(person) // update database with new person
      pubsub.publish(SUBSCRIPTION_EVENTS.PERSON_ADDED, { personAdded: person })// con esto estariamos creando una subscripcion
      return person // al decirle q devulva una persona hay q darle los datos de esa persona
    }
  },
  Person: {
    address: (root) => {
      return {
        street: root.street, // esto es para especificar dentro de los resolvers y transformarla en nuestro grhapql de 
        city: root.city      //manera que se sepa como se va a preguntar
      }
    }
  },
  Subscription: {

    personAdded: {
      subscribe: () => pubsub.asyncIterator(SUBSCRIPTION_EVENTS.PERSON_ADDED)
    },


  },
};

const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
server.start(({ port }) => {
  console.log(`Server on http://localhost:${port}/`);
});
