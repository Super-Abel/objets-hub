'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDictionary } from '@/i18n/provider';
import type { CollectionObject } from '@/lib/types';
import { updateObject } from './api';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_MB,
  checkImage,
  type ImageProblem,
} from './image-policy';

interface ObjectEditDialogProps {
  object: CollectionObject;
  /** Custom trigger; defaults to a small outline "Edit" button. */
  trigger?: React.ReactNode;
}

/**
 * Shared edit dialog used from the list card and the detail page. Prefills the
 * current values, lets the user optionally replace the image, and sends only
 * what actually changed. The refreshed data lands via the `object:updated`
 * socket event, so there is nothing to reconcile here.
 */
export function ObjectEditDialog({ object, trigger }: ObjectEditDialogProps) {
  const t = useDictionary();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(object.title);
  const [description, setDescription] = useState(object.description);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Re-seed the form whenever the dialog opens or the object changes under it
  // (e.g. another client edited it while this dialog was closed).
  useEffect(() => {
    if (!open) return;
    setTitle(object.title);
    setDescription(object.description);
    clearImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, object.title, object.description, object.imageUrl]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function imageProblemMessage(problem: ImageProblem): string {
    return problem === 'too-large'
      ? t.image.tooLarge(MAX_IMAGE_MB)
      : t.image.unsupportedType;
  }

  function clearImage() {
    setImage(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    if (fileInput.current) fileInput.current.value = '';
  }

  function pickImage(file: File | null) {
    if (!file) {
      clearImage();
      return;
    }
    const problem = checkImage(file);
    if (problem) {
      toast.error(imageProblemMessage(problem));
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    setImage(file);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    // The inputs are `required`, so the browser blocks an empty submit; trimming
    // here just normalises what we compare against and send.
    const nextTitle = title.trim();
    const nextDescription = description.trim();

    const patch: { title?: string; description?: string; image?: File } = {};
    if (nextTitle !== object.title) patch.title = nextTitle;
    if (nextDescription !== object.description) patch.description = nextDescription;
    if (image) patch.image = image;

    if (Object.keys(patch).length === 0) {
      toast.error(t.edit.noChanges);
      return;
    }

    setSubmitting(true);
    try {
      await updateObject(object.id, patch);
      toast.success(t.edit.saved);
      setOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Pencil className="h-3.5 w-3.5" />
            {t.edit.trigger}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.edit.heading}</DialogTitle>
          <DialogDescription>{t.edit.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`edit-title-${object.id}`}>{t.edit.title}</Label>
            <Input
              id={`edit-title-${object.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`edit-description-${object.id}`}>
              {t.edit.descriptionField}
            </Label>
            <Textarea
              id={`edit-description-${object.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`edit-image-${object.id}`}>{t.edit.image}</Label>
            <Input
              id={`edit-image-${object.id}`}
              ref={fileInput}
              type="file"
              accept={ALLOWED_IMAGE_MIME_TYPES.join(',')}
              onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              {t.edit.imageHint(MAX_IMAGE_MB)}
            </p>
          </div>

          <div className="flex gap-3">
            <figure className="flex-1 space-y-1">
              <figcaption className="text-xs text-muted-foreground">
                {t.edit.currentImageAlt}
              </figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={object.imageUrl}
                alt={t.edit.currentImageAlt}
                className="h-28 w-full rounded-md border object-cover"
              />
            </figure>
            {preview && (
              <figure className="flex-1 space-y-1">
                <figcaption className="text-xs font-medium text-primary">
                  {t.edit.newImageAlt}
                </figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt={t.edit.newImageAlt}
                  className="h-28 w-full rounded-md border object-cover"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => clearImage()}
                >
                  {t.edit.clearImage}
                </Button>
              </figure>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              {t.edit.cancel}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t.edit.submitting : t.edit.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
