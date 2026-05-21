export function TestModeBanner() {
  if (process.env.NEXT_PUBLIC_TEST_MODE === 'false') return null

  return (
    <div className="bg-amber-600 text-white text-center text-xs sm:text-sm tracking-wide py-2 px-4 font-medium">
      Test mode - this store is a demo. Orders placed here will NOT be fulfilled or shipped.
    </div>
  )
}
