import { Link } from 'react-router-dom'

function SocialIcon({
  href,
  label,
  svg,
}: {
  href: string
  label: string
  svg: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition"
    >
      {svg}
    </a>
  )
}

export default function Footer() {
  return (
    <footer className="bg-holi-nav text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-3">
        {/* Left: Logo / Brand */}
        <div>
          <h2 className="text-lg font-bold">HOLIDAZE</h2>
          <p className="mt-2 text-sm text-gray-200 leading-relaxed">
            Find your perfect holiday stay with ease. <br />
            Built by travelers, for explorers ✈️
          </p>
        </div>

        {/* Middle: Navigation */}
        <div>
          <h3 className="text-sm font-semibold">Navigation</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>
              <Link to="/venues" className="hover:underline">
                Venues
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:underline">
                Register
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:underline">
                Login
              </Link>
            </li>
          </ul>
        </div>

{/* Right: Socials */}
<div>
  <h3 className="text-sm font-semibold">Follow us</h3>
  <div className="mt-3 flex gap-4">
    {/* Facebook */}
    <SocialIcon
      href="https://www.facebook.com/"
      label="Facebook"
      svg={
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-5 w-5">
          <path d="M22.675 0h-21.35C.597 0 0 .598 0 1.333v21.333C0 23.403.597 24 1.325 24H12.82V14.708h-3.5v-3.6h3.5V8.413c0-3.46 2.107-5.346 5.184-5.346 1.473 0 2.74.109 3.107.158v3.605h-2.133c-1.673 0-2 .795-2 1.957v2.579h4l-.52 3.6h-3.48V24h6.82C23.403 24 24 23.403 24 22.667V1.333C24 .598 23.403 0 22.675 0z" />
        </svg>
      }
    />
    {/* X */}
    <SocialIcon
      href="https://x.com/"
      label="X"
      svg={
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-5 w-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.38l-5.247-6.862-6.002 6.862H1.823l7.73-8.838L1.5 2.25h7.05l4.713 6.201 4.981-6.201z" />
        </svg>
      }
    />
    {/* Instagram */}
    <SocialIcon
      href="https://www.instagram.com/"
      label="Instagram"
      svg={
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-5 w-5">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.338 3.608 1.314.975.975 1.252 2.243 1.314 3.609.058 1.267.069 1.645.069 4.852s-.012 3.585-.07 4.851c-.062 1.366-.338 2.634-1.314 3.609-.975.976-2.242 1.252-3.608 1.314-1.267.058-1.645.069-4.851.069s-3.585-.012-4.85-.07c-1.366-.062-2.633-.338-3.609-1.314-.976-.975-1.252-2.243-1.314-3.609C2.175 15.585 2.163 15.207 2.163 12s.012-3.585.07-4.851c.062-1.366.338-2.633 1.314-3.609.975-.975 2.243-1.252 3.609-1.314C8.416 2.175 8.794 2.163 12 2.163zm0 3.684a6.153 6.153 0 100 12.306 6.153 6.153 0 000-12.306zm7.2-1.147a1.44 1.44 0 110 2.881 1.44 1.44 0 010-2.881z" />
        </svg>
      }
    />
    {/* LinkedIn */}
    <SocialIcon
      href="https://www.linkedin.com/"
      label="LinkedIn"
      svg={
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-5 w-5">
          <path d="M22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.226.792 24 1.771 24h20.451c.979 0 1.778-.774 1.778-1.729V1.729C24 .774 23.204 0 22.225 0zM7.059 20.452H3.558V9h3.501v11.452zM5.309 7.433a2.025 2.025 0 110-4.05 2.025 2.025 0 010 4.05zm15.138 13.019h-3.5v-5.569c0-1.327-.027-3.037-1.852-3.037-1.853 0-2.138 1.447-2.138 2.941v5.665h-3.5V9h3.36v1.561h.049c.468-.887 1.607-1.823 3.303-1.823 3.531 0 4.178 2.324 4.178 5.345v6.369z" />
        </svg>
      }
    />
        </div>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-gray-200 flex justify-between">
          <span>© {new Date().getFullYear()} Holidaze. All rights reserved.</span>
          <span>
            Made with <span className="text-red-400">♥</span> at Noroff
          </span>
        </div>
      </div>
    </footer>
  )
}
