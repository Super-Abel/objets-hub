'use client';

import { useRef, useState } from 'react';
import { Check, ImagePlus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDictionary } from '@/i18n/provider';
import { createObject } from './api';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_MB,
  checkImage,
  type ImageProblem,
} from './image-policy';

/** An image the user has picked but not yet confirmed, plus its object-URL preview. */
interface PendingImage {
  file: File;
  url: string;
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ObjectForm() {
  const t = useDictionary();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // `image` is only set once the user has confirmed the preview; `pending` holds
  // a freshly picked file waiting for that confirmation.
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingImage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function imageProblemMessage(problem: ImageProblem): string {
    return problem === 'too-large'
      ? t.image.tooLarge(MAX_IMAGE_MB)
      : t.image.unsupportedType;
  }

  /** Stage a picked file for confirmation — it does not become `image` until confirmed. */
  function pickImage(file: File | null) {
    setPending((old) => {
      if (old) URL.revokeObjectURL(old.url);
      if (!file) return null;
      const problem = checkImage(file);
      if (problem) {
        toast.error(imageProblemMessage(problem));
        if (fileInput.current) fileInput.current.value = '';
        return null;
      }
      return { file, url: URL.createObjectURL(file) };
    });
  }

  /** Accept the pending image: promote it to the confirmed `image` used on submit. */
  function confirmImage() {
    if (!pending) return;
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return pending.url; // ownership of the URL moves from `pending` to `preview`
    });
    setImage(pending.file);
    setPending(null);
  }

  /** Discard the pending image and reopen the file picker. */
  function rejectImage() {
    pickImage(null);
    if (fileInput.current) {
      fileInput.current.value = '';
      fileInput.current.click();
    }
  }

  function reset() {
    setTitle('');
    setDescription('');
    setImage(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    pickImage(null);
    if (fileInput.current) fileInput.current.value = '';
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) {
      toast.error(t.form.imageNotConfirmed);
      return;
    }
    if (!image) {
      toast.error(t.form.imageRequired);
      return;
    }
    const problem = checkImage(image);
    if (problem) {
      toast.error(imageProblemMessage(problem));
      return;
    }
    setSubmitting(true);
    try {
      await createObject({ title: title.trim(), description: description.trim(), image });
      // The new card appears via the `object:created` socket event.
      toast.success(t.form.created);
      reset();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-muted text-brand">
          <Plus className="h-5 w-5" />
        </span>
        <div className="space-y-0.5">
          <CardTitle>{t.form.heading}</CardTitle>
          <p className="text-xs text-muted-foreground">{t.form.subheading}</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">{t.form.title}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t.form.description}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image">{t.form.image}</Label>
            <Input
              id="image"
              ref={fileInput}
              type="file"
              accept={ALLOWED_IMAGE_MIME_TYPES.join(',')}
              onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
              required
            />
            <p className="text-xs text-muted-foreground">
              {t.form.imageHint(MAX_IMAGE_MB)}
            </p>
          </div>

          {pending && (
            <div className="animate-fade-in-up space-y-2.5 rounded-lg border border-brand/30 bg-brand-muted/40 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ImagePlus className="h-4 w-4 text-brand" />
                {t.form.imagePreviewHeading}
              </div>
              <p className="text-xs text-muted-foreground">
                {t.form.imagePreviewHint}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pending.url}
                alt={t.form.imagePreviewAlt}
                className="h-40 w-full rounded-md border bg-secondary object-contain"
              />
              <p className="truncate text-xs text-muted-foreground">
                {pending.file.name} · {formatSize(pending.file.size)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={confirmImage}>
                  <Check className="h-3.5 w-3.5" />
                  {t.form.confirmImage}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={rejectImage}
                >
                  {t.form.rejectImage}
                </Button>
              </div>
            </div>
          )}

          {image && !pending && preview && (
            <div className="animate-fade-in-up space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-brand">
                <Check className="h-3.5 w-3.5" />
                {t.form.imageConfirmed}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={t.form.imagePreviewAlt}
                className="h-40 w-full rounded-md border object-cover"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => fileInput.current?.click()}
              >
                {t.form.changeImage}
              </Button>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={submitting || !image || !!pending}
            className="w-full"
          >
            {submitting ? t.form.submitting : t.form.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
