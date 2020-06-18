import React from "react"
import Transition from "./src/components/Transition"
require("prismjs/themes/prism-tomorrow.css")
require("./src/vendor/css/code.css")

export const wrapPageElement = ({ element, props }) => {
  return <Transition {...props}>{element}</Transition>
}
