// Middleware temporariamente desabilitado para demonstração
// import { withAuth } from "next-auth/middleware"

// export default withAuth(
//   function middleware(req) {
//     // Add any additional middleware logic here
//   },
//   {
//     callbacks: {
//       authorized: ({ token }) => !!token
//     },
//   }
// )

// export const config = {
//   matcher: ["/dashboard/:path*"]
// }

export default function middleware() {
  // Middleware vazio para demonstração
}
