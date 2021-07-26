import mongoose from "mongoose";

const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema;

const hotelSchema = new Schema(
  {
    title: {
      type: String,
      required: "Title is requred",
    },
    content: {
      type: String,
      required: "content is requred",
      maxlength: 10000,
    },
    location: {
      type: String,
    },
    price: {
      type: String,
      required: "Price is requred",
      trim: true,
    },
    postedBy: {
      type: ObjectId,
      ref: "User",
    },
    image: {
      data: Buffer,
      constentType: "String",
    },
    from: {
      type: Date,
    },
    to: {
      type: Date,
    },
    bed: {
      type: Number,
    },
  },
  { timestampes: true }
);

export default mongoose.model("Hotel", hotelSchema);
