import { GatsbyImageSharpFluidFragment } from "../../types/graphql-types";
import { FluidObject } from "gatsby-image";

export const createFluidImageFromImageSharp = (imageSharpFluid: GatsbyImageSharpFluidFragment | null | undefined): FluidObject | undefined => {
    if (!imageSharpFluid) return undefined
    return {
        aspectRatio: imageSharpFluid.aspectRatio,
        src: imageSharpFluid.src,
        srcSet: imageSharpFluid.srcSet,
        sizes: imageSharpFluid.sizes,
        base64: imageSharpFluid.base64 || undefined
    }
}