import { Axios, type Mode } from "../src"

const axios = new Axios({
  mode: process.env.BUILD_ENV as Mode,
  gateway: "optGateway",
  prefix: "/internal",
  withCredentials: true,
  // unauthorizedHandler() {}
})

async function bootstrp() {
  const {
    a: { a },
  } = await axios.request({
    url: "/observer/current",
    params: {
      a: 1,
      b: 2,
    },
  })
  // eslint-disable-next-line no-console
  console.log(a)
}

bootstrp()
