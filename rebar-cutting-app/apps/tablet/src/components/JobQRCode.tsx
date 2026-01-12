import QRCode from 'react-native-qrcode-svg';

const jobIdPattern = /^[A-Za-z0-9-_]+$/;

type Props = {
  jobId: string;
};

const buildJobQrValue = (jobId: string) => {
  if (typeof jobId !== 'string' || jobId.trim().length === 0) {
    throw new Error('Job ID must be a non-empty string.');
  }

  if (!jobIdPattern.test(jobId)) {
    throw new Error('Job ID must match [A-Za-z0-9-_]+.');
  }

  const value = `rebar://job/${jobId}`;

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('QR value must be a non-empty string.');
  }

  return value;
};

export function JobQRCode({ jobId }: Props) {
  const value = buildJobQrValue(jobId);

  return (
    <QRCode
      value={value}
      size={240}
      backgroundColor="white"
      color="black"
    />
  );
}
