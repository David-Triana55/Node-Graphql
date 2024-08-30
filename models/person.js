import moogose from "mongoose";
import mongooseUniqueValidator from "mongoose-unique-validator";
const personSchema = new moogose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	phone: {
		type: String,
	},
	street: {
		type: String,
		required: true,
	},
	city: {
		type: String,
		required: true,
	},
});

personSchema.plugin(mongooseUniqueValidator);
export default moogose.model("Person", personSchema);
