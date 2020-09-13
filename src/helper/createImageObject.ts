import { GatsbyImageSharpFluidFragment } from "../../types/graphql-types"
import { FluidObject } from "gatsby-image"

export const createFluidImageFromImageSharp = (
  imageSharpFluid: GatsbyImageSharpFluidFragment | null | undefined
): FluidObject => {
  if (!imageSharpFluid) throw new Error("invalidimage object")
  return {
    aspectRatio: imageSharpFluid.aspectRatio,
    src: imageSharpFluid.src,
    srcSet: imageSharpFluid.srcSet,
    sizes: imageSharpFluid.sizes,
    base64: imageSharpFluid.base64 || undefined,
  }
}
