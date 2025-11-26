import Image from 'next/image'

export default function DibsLogo({ size = 'normal' }: { size?: 'small' | 'normal' | 'large' }) {
  const sizes = {
    small: { width: 300, height: 300 },
    normal: { width: 450, height: 450 },
    large: { width: 600, height: 600 }
  }

  return (
    <div className="flex items-center justify-center -mb-24">
      <Image
        src="/dibs-logo.png"
        alt="DIBS Logo"
        width={sizes[size].width}
        height={sizes[size].height}
        priority
      />
    </div>
  )
}

