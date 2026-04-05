output "app_url" {
  description = "Public URL of the deployed application."
  value       = "https://classr.syphaxaitoubelli.com"
}

output "alb_dns_name" {
  description = "ALB DNS name — use this as the CNAME target in Namecheap."
  value       = aws_lb.main.dns_name
}

output "acm_validation_record_name" {
  description = "Add this as a CNAME record NAME in Namecheap to validate the SSL cert."
  value       = tolist(aws_acm_certificate.app.domain_validation_options)[0].resource_record_name
}

output "acm_validation_record_value" {
  description = "Add this as the CNAME record VALUE in Namecheap to validate the SSL cert."
  value       = tolist(aws_acm_certificate.app.domain_validation_options)[0].resource_record_value
}

output "ecr_repository_url" {
  description = "ECR repository URL for the app image."
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.app.name
}

output "aws_region" {
  value = var.aws_region
}
